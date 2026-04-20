# AI Assistant API Setup Guide

## 🔑 Getting Your Claude API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to "API Keys" section
4. Click "Create Key"
5. Copy your API key (starts with `sk-ant-`)

## 🛠️ Configuration

1. **Copy environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API key to `.env.local`:**
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   NEXT_PUBLIC_CLAUDE_MODEL=claude-3-5-sonnet-20241022
   ```

3. **Never commit `.env.local`** - it's already in `.gitignore`

## 💰 Cost Management

### Current Settings (Optimized for $20 budget):
- **Rate Limit:** 10 requests per 5 minutes per user
- **Max Tokens per Response:** 2,048 tokens (~1,500 words)
- **Conversation History:** Last 10 messages only
- **Model:** Claude 3.5 Sonnet (balanced cost/performance)

### Estimated Costs:
- **Input:** $3 per million tokens
- **Output:** $15 per million tokens
- **Average conversation:** ~1,000 input + 1,500 output tokens = ~$0.03
- **$20 budget:** ~600-700 conversations

### Tips to Save Credits:
1. **Clear chat history regularly** - reduces input tokens
2. **Be specific** - shorter, focused questions = shorter responses
3. **Test with fewer users** - rate limiting helps
4. **Monitor usage** in Anthropic Console

## 🔒 Security Features

✅ **API Key Protection:**
- Stored server-side only (never exposed to browser)
- Used in API routes only (not client components)
- Validated before each request

✅ **Rate Limiting:**
- IP-based throttling (10 req/5min)
- Prevents API abuse
- Saves credits

✅ **Input Validation:**
- Message sanitization
- Length limits (2000 chars)
- Format validation

✅ **Error Handling:**
- Graceful failures
- User-friendly messages
- No sensitive data leaks

## 🚀 Testing

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000/assistant`

3. **Test prompts:**
   - Click suggested prompt cards
   - Type custom questions
   - Check streaming responses

## 📊 Features

### ✨ Streaming Responses
- Real-time text generation
- Better UX (no waiting for full response)
- Efficient token usage

### 🎯 Optimized Prompts
- Financial analysis focused
- Stock market expertise
- Risk assessment
- Trading strategies
- Market sentiment

### 🛡️ Production-Ready
- Error boundaries
- Loading states
- Rate limit feedback
- API key validation
- CORS handling

## 🐛 Troubleshooting

### "API key not configured"
**Solution:** Add `ANTHROPIC_API_KEY` to `.env.local`

### "Rate limit exceeded"
**Solution:** Wait 5 minutes or adjust `RATE_LIMIT_MAX` in `app/api/chat/route.ts`

### "Invalid API key"
**Solution:** 
1. Check key format (should start with `sk-ant-`)
2. Verify key is active in Anthropic Console
3. Restart dev server after adding key

### Streaming not working
**Solution:**
1. Check browser console for errors
2. Verify API route is accessible
3. Test with simple prompt first

## 📈 Monitoring Usage

1. **Anthropic Console:**
   - View usage dashboard
   - Track remaining credits
   - Monitor request counts

2. **Application Logs:**
   - Check terminal for API errors
   - Review rate limit hits
   - Monitor response times

## 🔧 Advanced Configuration

### Adjust Rate Limits:
```typescript
// app/api/chat/route.ts
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 10; // requests per window
```

### Change Model:
```bash
# .env.local
NEXT_PUBLIC_CLAUDE_MODEL=claude-3-5-sonnet-20241022  # Balanced
# or
NEXT_PUBLIC_CLAUDE_MODEL=claude-3-opus-20240229      # Most capable (more expensive)
# or
NEXT_PUBLIC_CLAUDE_MODEL=claude-3-haiku-20240307     # Fastest (cheapest)
```

### Adjust Token Limits:
```typescript
// app/api/chat/route.ts
max_tokens: 2048, // Increase for longer responses (costs more)
```

## 📝 Best Practices

1. **Development:** Use Haiku model for testing (cheaper)
2. **Production:** Use Sonnet for user-facing features
3. **Monitor:** Check usage weekly
4. **Optimize:** Refine system prompts for efficiency
5. **Cache:** Consider implementing response caching for common questions

## 🎉 You're Ready!

Your AI Assistant is now fully configured and ready to provide intelligent financial insights! 🚀
