import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API for managing shared word cards library with user progress tracking
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
        query_params = event.get('queryStringParameters', {})
        resource = query_params.get('resource')
        group_id = query_params.get('groupId')
        
        if resource == 'groups':
            cur.execute("""
                SELECT g.id, g.name, g.description, g.color, g.created_at,
                       COUNT(cg.card_id) as card_count
                FROM groups g
                LEFT JOIN card_groups cg ON g.id = cg.group_id
                GROUP BY g.id, g.name, g.description, g.color, g.created_at
                ORDER BY g.created_at DESC
            """)
            
            groups = []
            for row in cur.fetchall():
                groups.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2] or '',
                    'color': row[3],
                    'createdAt': row[4].isoformat() if row[4] else None,
                    'cardCount': row[5]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'groups': groups}),
                'isBase64Encoded': False
            }
        
        if group_id:
            cur.execute("""
                SELECT c.id, c.russian, c.russian_example, c.english, c.english_example, 
                       COALESCE(up.is_learned, FALSE) as is_learned,
                       cat.id, cat.name, cat.color
                FROM cards c
                INNER JOIN card_groups cg ON c.id = cg.card_id
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN user_progress up ON c.id = up.card_id AND up.user_id = %s
                WHERE cg.group_id = %s
                ORDER BY c.created_at DESC
            """, (user_id, group_id))
        else:
            cur.execute("""
                SELECT c.id, c.russian, c.russian_example, c.english, c.english_example, 
                       COALESCE(up.is_learned, FALSE) as is_learned,
                       cat.id, cat.name, cat.color
                FROM cards c
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN user_progress up ON c.id = up.card_id AND up.user_id = %s
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
                'categoryId': row[6] if row[6] else None,
                'categoryName': row[7] if row[7] else None,
                'categoryColor': row[8] if row[8] else None
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
        
        if 'name' in body_data and 'color' in body_data and 'russian' not in body_data:
            name = body_data.get('name', '')
            description = body_data.get('description', '')
            color = body_data.get('color', '#3b82f6')
            
            cur.execute(
                "INSERT INTO groups (name, description, color) VALUES (%s, %s, %s) RETURNING id",
                (name, description, color)
            )
            
            group_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'groupId': group_id}),
                'isBase64Encoded': False
            }
        
        if 'groupId' in body_data and 'cardIds' in body_data:
            group_id = body_data['groupId']
            card_ids = body_data['cardIds']
            
            for card_id in card_ids:
                cur.execute(
                    "INSERT INTO card_groups (card_id, group_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (card_id, group_id)
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
        
        russian = body_data.get('russian', '')
        english = body_data.get('english', '')
        russian_example = body_data.get('russianExample', '')
        english_example = body_data.get('englishExample', '')
        category_id = body_data.get('categoryId')
        
        cur.execute(
            """INSERT INTO cards (category_id, russian, english, russian_example, english_example) 
               VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (category_id if category_id else None, russian, english, russian_example, english_example)
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
        
        if is_admin and 'groupId' in body_data and ('name' in body_data or 'color' in body_data):
            group_id = body_data.get('groupId') or body_data.get('id')
            name = body_data.get('name', '')
            description = body_data.get('description', '')
            color = body_data.get('color', '#3b82f6')
            
            cur.execute(
                "UPDATE groups SET name = %s, description = %s, color = %s WHERE id = %s",
                (name, description, color, group_id)
            )
        else:
            card_id = body_data.get('id') or body_data.get('cardId')
            
            if 'learned' in body_data:
                cur.execute(
                    """INSERT INTO user_progress (user_id, card_id, is_learned, updated_at) 
                       VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                       ON CONFLICT (user_id, card_id) 
                       DO UPDATE SET is_learned = %s, updated_at = CURRENT_TIMESTAMP""",
                    (user_id, card_id, body_data['learned'], body_data['learned'])
                )
            elif is_admin and ('russian' in body_data and 'english' in body_data):
                russian = body_data.get('russian', '')
                english = body_data.get('english', '')
                russian_example = body_data.get('russianExample', '')
                english_example = body_data.get('englishExample', '')
                category_id = body_data.get('categoryId')
                
                cur.execute(
                    "UPDATE cards SET russian = %s, english = %s, russian_example = %s, english_example = %s, category_id = %s WHERE id = %s",
                    (russian, english, russian_example, english_example, category_id, card_id)
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
        if not is_admin:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Admin access required'}),
                'isBase64Encoded': False
            }
        
        query_params = event.get('queryStringParameters', {})
        body_data = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        if 'cardId' in query_params and 'groupId' in query_params:
            cur.execute(
                "DELETE FROM card_groups WHERE card_id = %s AND group_id = %s",
                (query_params['cardId'], query_params['groupId'])
            )
        elif 'cardId' in body_data and 'groupId' in body_data:
            cur.execute(
                "DELETE FROM card_groups WHERE card_id = %s AND group_id = %s",
                (body_data['cardId'], body_data['groupId'])
            )
        elif 'groupId' in query_params or 'groupId' in body_data:
            group_id = query_params.get('groupId') or body_data.get('groupId')
            cur.execute("DELETE FROM card_groups WHERE group_id = %s", (group_id,))
            cur.execute("DELETE FROM groups WHERE id = %s", (group_id,))
        else:
            card_id = body_data.get('cardId') or body_data.get('id') or query_params.get('id')
            cur.execute("DELETE FROM card_groups WHERE card_id = %s", (card_id,))
            cur.execute("DELETE FROM user_progress WHERE card_id = %s", (card_id,))
            cur.execute("DELETE FROM cards WHERE id = %s", (card_id,))
        
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