import { render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

// Test component that uses the language context
const TestComponent = () => {
    const { language, setLanguage } = useLanguage();
    return (
        <div>
            <span data-testid="current-lang">{language}</span>
            <button onClick={() => setLanguage('zh')}>Switch to Chinese</button>
        </div>
    );
};

describe('LanguageContext', () => {
    it('should provide default language', () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );

        expect(screen.getByTestId('current-lang').textContent).toBe('en');
    });

    it('should allow language switching', async () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );

        const button = screen.getByText(/switch to chinese/i);
        button.click();

        await waitFor(() => {
            expect(screen.getByTestId('current-lang').textContent).toBe('zh');
        });
    });
});
