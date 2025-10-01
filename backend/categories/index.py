import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API for managing user categories (get and create)
    Args: event - dict with httpMethod, body, headers with X-User-Id
          context - object with request_id
    Returns: HTTP response with categories data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Is-Admin',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    is_admin = headers.get('X-Is-Admin') or headers.get('x-is-admin')
    is_admin = is_admin == 'true' if is_admin else False
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute(
            "SELECT id, name, color FROM categories WHERE user_id = %s ORDER BY created_at ASC",
            (user_id,)
        )
        
        categories = []
        for row in cur.fetchall():
            categories.append({
                'id': row[0],
                'name': row[1],
                'color': row[2]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'categories': categories}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        if not is_admin:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Admin access required'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        name = body_data.get('name', '').strip()
        color = body_data.get('color', 'bg-gradient-to-br from-gray-500 to-gray-600')
        
        if not name:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Category name required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "SELECT id FROM categories WHERE user_id = %s AND name = %s",
            (user_id, name)
        )
        
        if cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Category already exists'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO categories (user_id, name, color) VALUES (%s, %s, %s) RETURNING id",
            (user_id, name, color)
        )
        
        category_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'categoryId': category_id}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }