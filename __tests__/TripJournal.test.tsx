import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import TripJournal from '@/components/TripJournal';

// Mock react-markdown
jest.mock('react-markdown', () => {
    return function ReactMarkdown({ children }: { children: string }) {
        return <div data-testid="markdown-content">{children}</div>;
    };
});

describe('TripJournal Component', () => {
    const mockContent = '# Test Itinerary\\n\\nDay 1: Explore Paris';

    it('should render itinerary content', () => {
        render(
            <LanguageProvider>
                <TripJournal
                    content={mockContent}
                    onClose={jest.fn()}
                    isOpen={true}
                />
            </LanguageProvider>
        );

        const markdown = screen.getByTestId('markdown-content');
        expect(markdown).toBeInTheDocument();
    });

    it('should render close button', () => {
        render(
            <LanguageProvider>
                <TripJournal
                    content={mockContent}
                    onClose={jest.fn()}
                    isOpen={true}
                />
            </LanguageProvider>
        );

        const closeButtons = screen.getAllByRole('button');
        expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should not render when closed', () => {
        const { container } = render(
            <LanguageProvider>
                <TripJournal
                    content={mockContent}
                    onClose={jest.fn()}
                    isOpen={false}
                />
            </LanguageProvider>
        );

        expect(container.firstChild).toBeNull();
    });
});
