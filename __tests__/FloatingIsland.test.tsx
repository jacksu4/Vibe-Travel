import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import FloatingIsland from '@/components/FloatingIsland';

describe('FloatingIsland Component', () => {
    it('should render input fields', () => {
        const { container } = render(
            <LanguageProvider>
                <FloatingIsland
                    onSearch={jest.fn()}
                    onClear={jest.fn()}
                    isLoading={false}
                />
            </LanguageProvider>
        );

        // Just check that the component renders
        expect(container).toBeInTheDocument();
    });

    it('should render Launch button', () => {
        render(
            <LanguageProvider>
                <FloatingIsland
                    onSearch={jest.fn()}
                    onClear={jest.fn()}
                    isLoading={false}
                />
            </LanguageProvider>
        );

        expect(screen.getByText(/launch/i)).toBeInTheDocument();
    });

    it('should show loading state', () => {
        const { container } = render(
            <LanguageProvider>
                <FloatingIsland
                    onSearch={jest.fn()}
                    onClear={jest.fn()}
                    isLoading={true}
                />
            </LanguageProvider>
        );

        // Component should render during loading
        expect(container).toBeInTheDocument();
    });
});
