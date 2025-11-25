import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

describe('LanguageToggle Component', () => {
    it('should render language toggle button', () => {
        render(
            <LanguageProvider>
                <LanguageToggle />
            </LanguageProvider>
        );

        // Should render a button (either EN or 中文 depending on default)
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });
});
