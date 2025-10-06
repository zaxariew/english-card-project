import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API for viewing user accounts and their progress (admin only)
    Args: event - dict with httpMethod, headers with X-Is-Admin
          context - object with request_id
    Returns: HTTP response with users data and progress
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Is-Admin',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    is_admin = headers.get('X-Is-Admin') or headers.get('x-is-admin')
    is_admin = is_admin == 'true' if is_admin else False
    
    if not is_admin:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Admin access required'}),
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute("SELECT username FROM admins")
        admin_usernames = {row[0] for row in cur.fetchall()}
        
        cur.execute("""
            SELECT 
                u.id, 
                u.username, 
                u.created_at,
                COUNT(DISTINCT CASE WHEN up.is_learned = TRUE THEN up.card_id END) as cards_learned
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            GROUP BY u.id, u.username, u.created_at
            ORDER BY u.created_at DESC
        """)
        
        all_users = cur.fetchall()
        
        cur.execute("SELECT COUNT(*) FROM cards")
        total_cards = cur.fetchone()[0] or 1
        
        users = []
        for row in all_users:
            if row[1] in admin_usernames:
                continue
            
            learned = row[3] or 0
            users.append({
                'id': row[0],
                'username': row[1],
                'createdAt': row[2].isoformat() if row[2] else None,
                'cardsLearned': learned,
                'totalCards': total_cards,
                'progress': round(learned / total_cards * 100, 1)
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'users': users}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }