from flask import Blueprint, request, redirect, url_for

prompt_bp = Blueprint(
    'prompt',
    __name__,
    url_prefix='/prompt',
    template_folder='templates' # Tells Flask to look for templates in this folder
)

@prompt_bp.route('/', methods=['POST'])
def handle_prompt():
    """
    Read the submitted form data and redirect to /analysis
    """
    ticker       = request.form.get('ticker', '').upper()
    term         = request.form.get('term', 'long')

    
    # We add 'summarize=true' as a flag for the analysis endpoint
    # to know it should run the AI summary.
    return redirect(
        url_for(
            'analysis.analyze_ticker', # The name of the function in analysis.py
            ticker=ticker,
            mode=term,
            summarize='true' # This is the new flag!
        )
    )