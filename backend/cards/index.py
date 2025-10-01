import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API for managing user word cards with global dictionary
    Args: event - dict with httpMethod, body, headers with X-User-Id
          context - object with request_id
    Returns: HTTP response with cards data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
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
        cur.execute("""
            SELECT c.id, gw.russian, gw.russian_example, gw.english, gw.english_example, 
                   c.learned, cat.id, cat.name, cat.color
            FROM cards c
            JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN global_words gw ON c.word_id = gw.id
            WHERE c.user_id = %s
            ORDER BY c.created_at DESC
        """, (user_id,))
        
        cards = []
        for row in cur.fetchall():
            cards.append({
                'id': row[0],
                'russian': row[1] or '',
                'russianExample': row[2] or '',
                'english': row[3] or '',
                'englishExample': row[4] or '',
                'learned': row[5],
                'categoryId': row[6],
                'categoryName': row[7],
                'categoryColor': row[8]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'cards': cards}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        russian = body_data.get('russian', '')
        english = body_data.get('english', '')
        russian_example = body_data.get('russianExample', '')
        english_example = body_data.get('englishExample', '')
        
        cur.execute("SELECT id FROM global_words WHERE russian = %s", (russian,))
        existing_word = cur.fetchone()
        
        if existing_word:
            word_id = existing_word[0]
        else:
            cur.execute(
                """INSERT INTO global_words (russian, english, russian_example, english_example) 
                   VALUES (%s, %s, %s, %s) RETURNING id""",
                (russian, english, russian_example, english_example)
            )
            word_id = cur.fetchone()[0]
        
        cur.execute(
            """INSERT INTO cards (user_id, category_id, word_id, learned) 
               VALUES (%s, %s, %s, %s) RETURNING id""",
            (user_id, body_data['categoryId'], word_id, False)
        )
        
        card_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'cardId': card_id}),
            'isBase64Encoded': False
        }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        card_id = body_data.get('id')
        
        if 'learned' in body_data:
            cur.execute(
                "UPDATE cards SET learned = %s WHERE id = %s AND user_id = %s",
                (body_data['learned'], card_id, user_id)
            )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    elif method == 'DELETE':
        query_params = event.get('queryStringParameters', {})
        card_id = query_params.get('id')
        
        cur.execute(
            "DELETE FROM cards WHERE id = %s AND user_id = %s",
            (card_id, user_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
