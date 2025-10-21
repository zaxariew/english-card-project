import json
import os
import hashlib
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Authentication API for user login and registration
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with user session data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    username = body_data.get('username', '').strip()
    password = body_data.get('password', '')
    
    if not username or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username and password required'}),
            'isBase64Encoded': False
        }
    
    username_escaped = username.replace("'", "''")
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    if action == 'register':
        cur.execute(f"SELECT id FROM users WHERE username = '{username_escaped}'")
        existing = cur.fetchone()
        
        if existing:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username already exists'}),
                'isBase64Encoded': False
            }
        
        cur.execute(f"INSERT INTO users (username, password_hash) VALUES ('{username_escaped}', '{password_hash}') RETURNING id")
        user_id = cur.fetchone()[0]
        conn.commit()
        
        default_categories = [
            ('Животные', 'bg-gradient-to-br from-purple-500 to-purple-600'),
            ('Еда', 'bg-gradient-to-br from-pink-500 to-pink-600'),
            ('Путешествия', 'bg-gradient-to-br from-orange-500 to-orange-600'),
            ('Работа', 'bg-gradient-to-br from-blue-500 to-blue-600'),
        ]
        
        for cat_name, cat_color in default_categories:
            cat_name_escaped = cat_name.replace("'", "''")
            cat_color_escaped = cat_color.replace("'", "''")
            cur.execute(f"INSERT INTO categories (user_id, name, color) VALUES ({user_id}, '{cat_name_escaped}', '{cat_color_escaped}')")
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'userId': user_id, 'username': username}),
            'isBase64Encoded': False
        }
    
    elif action == 'login':
        cur.execute(f"SELECT id, username FROM admins WHERE username = '{username_escaped}'")
        admin = cur.fetchone()
        
        if admin:
            cur.execute(f"SELECT password_hash FROM admins WHERE id = {admin[0]}")
            stored_hash = cur.fetchone()[0]
            
            if stored_hash == 'admin':
                cur.execute(f"UPDATE admins SET password_hash = '{password_hash}' WHERE id = {admin[0]}")
                conn.commit()
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'userId': admin[0], 'username': admin[1], 'isAdmin': True}),
                    'isBase64Encoded': False
                }
            elif stored_hash == password_hash:
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'userId': admin[0], 'username': admin[1], 'isAdmin': True}),
                    'isBase64Encoded': False
                }
            else:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
        
        cur.execute(f"SELECT id, username FROM users WHERE username = '{username_escaped}' AND password_hash = '{password_hash}'")
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid credentials'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'userId': user[0], 'username': user[1], 'isAdmin': False}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'}),
        'isBase64Encoded': False
    }
