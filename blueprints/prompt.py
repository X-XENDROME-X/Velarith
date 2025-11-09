from flask import Blueprint, render_template, request, redirect, url_for

prompt_bp = Blueprint(
    'prompt',
    __name__,
    url_prefix='/prompt',
    template_folder='templates' # Tells Flask to look for templates in this folder
)

@prompt_bp.route('/', methods=['GET'])
def show_prompt_form():
    """
    Render a simple HTML form to collect:
     - ticker symbol
     - term (short or long)
     - age
     - risk profile
    """
    # Renders the 'prompt.html' file from the 'templates' folder
    return render_template('prompt.html')


@prompt_bp.route('/', methods=['POST'])
def handle_prompt():
    """
    Read the submitted form data and redirect to /analysis
    """
    ticker       = request.form.get('ticker', '').upper()
    term         = request.form.get('term', 'long')
    age          = request.form.get('age', '30-40')
    risk         = request.form.get('risk', 'moderate')
    
    # We add 'summarize=true' as a flag for the analysis endpoint
    # to know it should run the AI summary.
    return redirect(
        url_for(
            'analysis.analyze_ticker', # The name of the function in analysis.py
            ticker=ticker,
            mode=term,
            age=age,
            risk_profile=risk,
            summarize='true' # This is the new flag!
        )
    )