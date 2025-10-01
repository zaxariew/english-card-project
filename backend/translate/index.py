import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: AI-powered translation and example generation for word cards
    Args: event - dict with httpMethod, body containing russian or english word
          context - object with request_id
    Returns: HTTP response with translation and example sentences
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    russian_word = body_data.get('russian', '').strip()
    
    if not russian_word:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Russian word required'}),
            'isBase64Encoded': False
        }
    
    api_key = os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OpenAI API key not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        import requests
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are a helpful language teacher. Translate Russian words to English and provide example sentences in both languages. Respond ONLY with valid JSON in this exact format: {"english": "word", "russianExample": "sentence", "englishExample": "sentence"}'
                    },
                    {
                        'role': 'user',
                        'content': f'Translate this Russian word to English and provide example sentences: {russian_word}'
                    }
                ],
                'temperature': 0.3,
                'max_tokens': 200
            },
            timeout=10
        )
        
        if response.status_code != 200:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'OpenAI API error'}),
                'isBase64Encoded': False
            }
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        translation_data = json.loads(content)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'english': translation_data.get('english', ''),
                'russianExample': translation_data.get('russianExample', f'{russian_word} в предложении'),
                'englishExample': translation_data.get('englishExample', 'Example sentence')
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Translation error: {str(e)}'}),
            'isBase64Encoded': False
        }
