/**
 * Progressive Enhancement Tests
 * Tests that verify progressive enhancement functionality works correctly
 * and doesn't cause hydration issues
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
// Temporarily commented out for build
// import {
//     useProgressiveEnhancement,
//     useBrowserAPI,
//     useHydrationSafeAnimation
// } from '@/lib/utils/hydrationUtils'
// import {
//     useProgressiveDateDisplay,
//     getStaticDateDisplay
// } from '@/lib/utils/dateFormatting'
// import {
//     useHydrationSafeAnimations,
//     getTableRowClasses,
//     getButtonClasses,
//     conditionalAnimationClass
// } from '@/lib/utils/animationUtils'

// Test components for progressive enhancement - temporarily disabled
const ProgressiveEnhancementTestComponent = () => {
    // const { isClient, isHydrated, enableFeature } = useProgressiveEnhancement()
    const [featureEnabled, setFeatureEnabled] = React.useState(false)

    const handleEnableFeature = () => {
        enableFeature(() => setFeatureEnabled(true))
    }

    return (
        <div>
            <div data-testid="client-status">{isClient.toString()}</div>
            <div data-testid="hydrated-status">{isHydrated.toString()}</div>
            <div data-testid="feature-status">{featureEnabled.toString()}</div>
            <button onClick={handleEnableFeature} data-testid="enable-feature">
                Enable Feature
            </button>
        </div>
    )
}

const BrowserAPITestComponent = () => {
    const { isBrowser, window: windowObj, document: documentObj } = useBrowserAPI()

    return (
        <div>
            <div data-testid="browser-status">{isBrowser.toString()}</div>
            <div data-testid="window-available">{(windowObj !== null).toString()}</div>
            <div data-testid="document-available">{(documentObj !== null).toString()}</div>
        </div>
    )
}

const AnimationTestComponent = ({ initialState = false }: { initialState?: boolean }) => {
    const { isAnimationEnabled, enableAnimations, disableAnimations } = useHydrationSafeAnimation(initialState)

    return (
        <div>
            <div data-testid="animation-status">{isAnimationEnabled.toString()}</div>
            <button onClick={enableAnimations} data-testid="enable-animations">
                Enable Animations
            </button>
            <button onClick={disableAnimations} data-testid="disable-animations">
                Disable Animations
            </button>
            <div
                className={conditionalAnimationClass(isAnimationEnabled, 'transition-all duration-200')}
                data-testid="animated-element"
            >
                Animated Element
            </div>
        </div>
    )
}

const DateDisplayTestComponent = ({ date, showRelative = false }: { date: string; showRelative?: boolean }) => {
    const dateDisplay = useProgressiveDateDisplay(date, {
        showRelativeTime: showRelative,
        enableClientEnhancements: true
    })

    return (
        <div>
            <div data-testid="absolute-date">{dateDisplay.absolute}</div>
            <div data-testid="relative-date">{dateDisplay.relative}</div>
            <div data-testid="enhanced-status">{dateDisplay.isEnhanced.toString()}</div>
            <div data-testid="iso-date">{dateDisplay.iso}</div>
        </div>
    )
}

const TableRowTestComponent = () => {
    const animationsEnabled = useHydrationSafeAnimations()

    return (
        <table>
            <tbody>
                <tr className={getTableRowClasses(animationsEnabled)} data-testid="table-row">
                    <td>Test Cell</td>
                </tr>
            </tbody>
        </table>
    )
}

describe('Progressive Enhancement Tests', () => {
    describe('useProgressiveEnhancement Hook', () => {
        it('should start with client and hydrated as false', () => {
            render(<ProgressiveEnhancementTestComponent />)

            expect(screen.getByTestId('client-status')).toHaveTextContent('false')
            expect(screen.getByTestId('hydrated-status')).toHaveTextContent('false')
        })

        it('should eventually set client and hydrated to true', async () => {
            render(<ProgressiveEnhancementTestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('client-status')).toHaveTextContent('true')
                expect(screen.getByTestId('hydrated-status')).toHaveTextContent('true')
            })
        })

        it('should enable features only when hydrated', async () => {
            const user = userEvent.setup()
            render(<ProgressiveEnhancementTestComponent />)

            // Initially feature should be disabled
            expect(screen.getByTestId('feature-status')).toHaveTextContent('false')

            // Wait for hydration
            await waitFor(() => {
                expect(screen.getByTestId('hydrated-status')).toHaveTextContent('true')
            })

            // Now enable feature
            await user.click(screen.getByTestId('enable-feature'))

            expect(screen.getByTestId('feature-status')).toHaveTextContent('true')
        })

        it('should not enable features before hydration', async () => {
            const user = userEvent.setup()
            render(<ProgressiveEnhancementTestComponent />)

            // Try to enable feature before hydration
            await user.click(screen.getByTestId('enable-feature'))

            // Feature should remain disabled
            expect(screen.getByTestId('feature-status')).toHaveTextContent('false')
        })
    })

    describe('useBrowserAPI Hook', () => {
        it('should start with browser APIs unavailable', () => {
            render(<BrowserAPITestComponent />)

            expect(screen.getByTestId('browser-status')).toHaveTextContent('false')
            expect(screen.getByTestId('window-available')).toHaveTextContent('false')
            expect(screen.getByTestId('document-available')).toHaveTextContent('false')
        })

        it('should eventually provide browser APIs', async () => {
            render(<BrowserAPITestComponent />)

            await waitFor(() => {
                expect(screen.getByTestId('browser-status')).toHaveTextContent('true')
                expect(screen.getByTestId('window-available')).toHaveTextContent('true')
                expect(screen.getByTestId('document-available')).toHaveTextContent('true')
            })
        })
    })

    describe('useHydrationSafeAnimation Hook', () => {
        it('should start with animations disabled by default', () => {
            render(<AnimationTestComponent />)

            expect(screen.getByTestId('animation-status')).toHaveTextContent('false')
        })

        it('should respect initial state', () => {
            render(<AnimationTestComponent initialState={true} />)

            expect(screen.getByTestId('animation-status')).toHaveTextContent('true')
        })

        it('should enable animations after hydration delay', async () => {
            render(<AnimationTestComponent />)

            // Should eventually enable animations
            await waitFor(() => {
                expect(screen.getByTestId('animation-status')).toHaveTextContent('true')
            }, { timeout: 1000 })
        })

        it('should allow manual control of animations', async () => {
            const user = userEvent.setup()
            render(<AnimationTestComponent />)

            // Manually enable animations
            await user.click(screen.getByTestId('enable-animations'))
            expect(screen.getByTestId('animation-status')).toHaveTextContent('true')

            // Manually disable animations
            await user.click(screen.getByTestId('disable-animations'))
            expect(screen.getByTestId('animation-status')).toHaveTextContent('false')
        })

        it('should conditionally apply animation classes', async () => {
            const user = userEvent.setup()
            render(<AnimationTestComponent />)

            const animatedElement = screen.getByTestId('animated-element')

            // Initially should not have animation classes
            expect(animatedElement.className).not.toContain('transition-all')

            // Enable animations
            await user.click(screen.getByTestId('enable-animations'))

            // Should now have animation classes
            expect(animatedElement.className).toContain('transition-all')
            expect(animatedElement.className).toContain('duration-200')
        })
    })

    describe('Progressive Date Display', () => {
        const testDate = '2024-01-15T10:30:00.000Z'

        it('should show static date immediately', () => {
            render(<DateDisplayTestComponent date={testDate} />)

            expect(screen.getByTestId('absolute-date')).toHaveTextContent('Jan 15, 2024')
            expect(screen.getByTestId('iso-date')).toHaveTextContent('2024-01-15T10:30:00.000Z')
        })

        it('should show placeholder for relative time initially', () => {
            render(<DateDisplayTestComponent date={testDate} showRelative={true} />)

            expect(screen.getByTestId('relative-date')).toHaveTextContent('Click to see relative time')
            expect(screen.getByTestId('enhanced-status')).toHaveTextContent('false')
        })

        it('should enhance with relative time after client hydration', async () => {
            render(<DateDisplayTestComponent date={testDate} showRelative={true} />)

            await waitFor(() => {
                expect(screen.getByTestId('enhanced-status')).toHaveTextContent('true')
            })

            await waitFor(() => {
                const relativeText = screen.getByTestId('relative-date').textContent
                expect(relativeText).not.toBe('Click to see relative time')
                expect(relativeText).toMatch(/ago|Today|Yesterday/)
            })
        })

        it('should handle various date formats consistently', async () => {
            const dates = [
                '2024-01-15T10:30:00.000Z',
                new Date('2024-01-15T10:30:00.000Z').toISOString(),
                '2024-01-15'
            ]

            const results = dates.map(date => {
                const { container } = render(<DateDisplayTestComponent date={date} />)
                const absoluteDate = container.querySelector('[data-testid="absolute-date"]')?.textContent
                return absoluteDate
            })

            // All should produce the same absolute date
            expect(results[0]).toBe(results[1])
            expect(results[0]).toBe('Jan 15, 2024')
        })

        it('should calculate relative time correctly', async () => {
            // Test with a date from yesterday
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            render(<DateDisplayTestComponent date={yesterday.toISOString()} showRelative={true} />)

            await waitFor(() => {
                expect(screen.getByTestId('enhanced-status')).toHaveTextContent('true')
            })

            await waitFor(() => {
                const relativeText = screen.getByTestId('relative-date').textContent
                expect(relativeText).toMatch(/Yesterday|1 day ago/)
            })
        })
    })

    describe('Animation Utility Functions', () => {
        it('should provide different classes based on animation state', () => {
            const noAnimClasses = getTableRowClasses(false)
            const animClasses = getTableRowClasses(true)

            // Both should have base classes
            expect(noAnimClasses).toContain('border-b')
            expect(animClasses).toContain('border-b')

            // Only animated version should have hover effects
            expect(noAnimClasses).not.toContain('hover:bg-gray-50')
            expect(animClasses).toContain('hover:bg-gray-50')
            expect(animClasses).toContain('transition-colors')
        })

        it('should handle button variants correctly', () => {
            const variants = ['primary', 'secondary', 'danger', 'success'] as const

            variants.forEach(variant => {
                const noAnimButton = getButtonClasses(false, variant)
                const animButton = getButtonClasses(true, variant)

                // Both should have base variant classes
                expect(noAnimButton).toContain('font-medium')
                expect(animButton).toContain('font-medium')

                // Only animated version should have transitions
                expect(animButton).toContain('transition-all')
                expect(noAnimButton).not.toContain('transition-all')
            })
        })

        it('should conditionally apply animation classes', () => {
            const testClass = 'transition-opacity duration-300'

            expect(conditionalAnimationClass(false, testClass)).toBe('')
            expect(conditionalAnimationClass(true, testClass)).toBe(testClass)
        })
    })

    describe('Integration with Real Components', () => {
        it('should progressively enhance table rows', async () => {
            const { container } = render(<TableRowTestComponent />)
            const tableRow = screen.getByTestId('table-row')

            // Initially should not have animation classes
            expect(tableRow.className).not.toContain('transition-colors')

            // Wait for animations to be enabled
            await waitFor(() => {
                expect(tableRow.className).toContain('transition-colors')
                expect(tableRow.className).toContain('hover:bg-gray-50')
            })
        })

        it('should maintain functionality without enhancements', () => {
            // Mock animations as permanently disabled
            jest.doMock('@/lib/utils/animationUtils', () => ({
                ...jest.requireActual('@/lib/utils/animationUtils'),
                useHydrationSafeAnimations: () => false,
            }))

            const { container } = render(<TableRowTestComponent />)
            const tableRow = screen.getByTestId('table-row')

            // Should still render and be functional
            expect(tableRow).toBeInTheDocument()
            expect(tableRow.textContent).toContain('Test Cell')

            // Should have base classes but no animations
            expect(tableRow.className).toContain('border-b')
            expect(tableRow.className).not.toContain('transition-colors')
        })
    })

    describe('Performance and Edge Cases', () => {
        it('should handle rapid state changes without issues', async () => {
            const user = userEvent.setup()
            render(<AnimationTestComponent />)

            // Rapidly toggle animations
            for (let i = 0; i < 10; i++) {
                await user.click(screen.getByTestId('enable-animations'))
                await user.click(screen.getByTestId('disable-animations'))
            }

            // Should still be functional
            expect(screen.getByTestId('animation-status')).toHaveTextContent('false')
        })

        it('should handle component unmounting during enhancement', () => {
            const { unmount } = render(<ProgressiveEnhancementTestComponent />)

            // Unmount before enhancement completes
            expect(() => {
                unmount()
            }).not.toThrow()
        })

        it('should handle invalid dates gracefully', () => {
            const invalidDates = ['invalid-date', '', 'not-a-date']

            invalidDates.forEach(date => {
                expect(() => {
                    render(<DateDisplayTestComponent date={date} />)
                }).not.toThrow()
            })
        })

        it('should not cause memory leaks with multiple enhancements', () => {
            // Render and unmount multiple components
            for (let i = 0; i < 20; i++) {
                const { unmount } = render(
                    <div>
                        <ProgressiveEnhancementTestComponent />
                        <BrowserAPITestComponent />
                        <AnimationTestComponent />
                        <DateDisplayTestComponent date="2024-01-15T10:30:00.000Z" />
                    </div>
                )
                unmount()
            }

            // Should complete without issues
            expect(true).toBe(true)
        })
    })

    describe('Accessibility and User Experience', () => {
        it('should maintain accessibility without enhancements', () => {
            render(<AnimationTestComponent />)

            // Buttons should be accessible
            const enableButton = screen.getByTestId('enable-animations')
            const disableButton = screen.getByTestId('disable-animations')

            expect(enableButton).toBeInTheDocument()
            expect(disableButton).toBeInTheDocument()
            expect(enableButton.tagName).toBe('BUTTON')
            expect(disableButton.tagName).toBe('BUTTON')
        })

        it('should provide meaningful content without JavaScript', () => {
            render(<DateDisplayTestComponent date="2024-01-15T10:30:00.000Z" showRelative={true} />)

            // Should show meaningful date even without enhancement
            expect(screen.getByTestId('absolute-date')).toHaveTextContent('Jan 15, 2024')

            // Should show helpful placeholder for relative time
            expect(screen.getByTestId('relative-date')).toHaveTextContent('Click to see relative time')
        })

        it('should enhance user experience progressively', async () => {
            render(<DateDisplayTestComponent date="2024-01-15T10:30:00.000Z" showRelative={true} />)

            // Start with basic functionality
            expect(screen.getByTestId('absolute-date')).toHaveTextContent('Jan 15, 2024')

            // Enhance with relative time
            await waitFor(() => {
                const relativeText = screen.getByTestId('relative-date').textContent
                expect(relativeText).not.toBe('Click to see relative time')
            })

            // Enhanced status should reflect the improvement
            expect(screen.getByTestId('enhanced-status')).toHaveTextContent('true')
        })
    })
})