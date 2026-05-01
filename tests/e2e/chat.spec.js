const { test, expect } = require('@playwright/test');

test.describe('Chat E2E', () => {
  test('should stream AI response via SSE successfully', async ({ page }) => {
    // Navigate to application
    await page.goto('/');

    // Wait for the app to initialize and ensure Chat is active
    await expect(page.locator('#nav-chat')).toHaveClass(/nav__btn--active/);

    // Locate the chat input and send a message
    const input = page.locator('#chat-input');
    await input.fill('Hello, test the SSE stream');
    
    // Click the submit button
    const submitBtn = page.locator('#chat-form button[type="submit"]');
    await submitBtn.click();

    // Verify user message appears in the chat
    const chatMessages = page.locator('#chat-messages');
    await expect(chatMessages.locator('.message--user').last()).toContainText('Hello, test the SSE stream');

    // Wait for the AI bubble to appear and the typing indicator to show up
    const aiMessage = chatMessages.locator('.message--ai').last();
    await expect(aiMessage.locator('.typing-indicator')).toBeVisible();

    // Wait for the stream to finish by waiting for the TTS button to be attached
    // This is a reliable indicator that the response has fully arrived
    const ttsBtn = aiMessage.locator('.message__tts-btn');
    await expect(ttsBtn).toBeVisible({ timeout: 15000 });
    
    // Assert that the bubble is not empty (it contains the streamed response or an error message)
    const content = await aiMessage.locator('.message__bubble').textContent();
    expect(content?.trim()?.length).toBeGreaterThan(0);
  });
});
