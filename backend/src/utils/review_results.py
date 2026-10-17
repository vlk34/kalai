def normalize_review(result):
    if not isinstance(result, dict) or not isinstance(result.get('summary'), str) or not result['summary'].strip():
        raise ValueError('Expected a review summary')
    suggestions = result.get('suggestions')
    if not isinstance(suggestions, list) or not suggestions:
        raise ValueError('Expected review suggestions')
    for suggestion in suggestions:
        if not isinstance(suggestion, dict) or suggestion.get('severity') not in ('high', 'medium', 'low'):
            raise ValueError('Expected a suggestion severity')
        if not isinstance(suggestion.get('message'), str) or not suggestion['message'].strip():
            raise ValueError('Expected a suggestion message')
    return {
        'summary': result['summary'],
        'suggestions': sorted(suggestions, key=lambda suggestion: suggestion['severity'])[:5]
    }
