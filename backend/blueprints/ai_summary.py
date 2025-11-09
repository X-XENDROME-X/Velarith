import os
import anthropic

# Initialize the client (it will auto-find the API key)
try:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    CLAUDE_MODEL = "claude-3-haiku-20240307" # Fastest and great for this
    HAS_CLAUDE = True
except Exception as e:
    print(f"[WARN] Claude client failed to initialize: {e}")
    print("[WARN] AI Summaries will be disabled.")
    HAS_CLAUDE = False
    client = None

def get_claude_analysis(prompt: str) -> str:
    """
    Sends the fully-formed prompt to Claude and returns the
    Markdown response.
    """
    if not HAS_CLAUDE:
        return "AI summary is unavailable (client not initialized)."

    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            temperature=0.3,
            system="You are a professional, no-nonsense equity analyst. You will provide a summary in the exact Markdown format requested, with no extra conversation.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Get the text content from the response
        response_text = ""
        if message.content and isinstance(message.content, list):
            for block in message.content:
                if block.type == "text":
                    response_text = block.text.strip()
                    break
        
        if not response_text:
            return "AI summary returned an empty response."

        # Optional: strip surrounding code fences
        if response_text.startswith("```markdown"):
            response_text = response_text[len("```markdown"):].strip()
        if response_text.startswith("```"):
            response_text = response_text[3:].strip()
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

        return response_text

    except Exception as e:
        print(f"[CLAUDE ERROR] {e}")
        return f"AI summary failed to generate: {e}"