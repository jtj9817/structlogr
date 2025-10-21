import { createFormIds, generateId, generateTestId } from '@/lib/utils';
import { useId } from 'react';

/**
 * Hook for generating unique, SSR-compatible IDs using React's useId.
 * Combines deterministic naming with React's stable ID generation.
 *
 * @param page - The page or feature name
 * @param component - The component name
 * @param element - The specific element
 * @param type - The element type (optional, defaults to 'element')
 * @returns Object containing unique ID and test ID
 *
 * @example
 * const { id, testId } = useUniqueId('auth', 'login', 'email', 'input');
 * // Returns: { id: ':R1:auth-login-email-input', testId: 'test-auth-login-email' }
 */
export function useUniqueId(
    page: string,
    component: string,
    element: string,
    type: string = 'element',
): { id: string; testId: string } {
    const reactId = useId();
    const deterministicId = generateId(page, component, element, type);
    const testId = generateTestId(page, component, element);

    // Combine React's stable ID with our deterministic ID for SSR compatibility
    const id = `${reactId}${deterministicId}`;

    return { id, testId };
}

/**
 * Hook for generating form-related IDs (input, label, error, description).
 * Ensures all form elements have consistent, accessible IDs.
 *
 * @param page - The page or feature name
 * @param component - The component name
 * @param element - The form element name
 * @returns Object containing all form-related IDs
 *
 * @example
 * const ids = useFormIds('auth', 'login', 'email');
 * // Returns: {
 * //   input: ':R1:auth-login-email-input',
 * //   label: ':R1:auth-login-email-label',
 * //   error: ':R1:auth-login-email-error',
 * //   description: ':R1:auth-login-email-description',
 * //   testId: 'test-auth-login-email'
 * // }
 */
export function useFormIds(page: string, component: string, element: string) {
    const reactId = useId();
    const baseIds = createFormIds(page, component, element);

    // Add React's stable ID prefix for SSR compatibility
    return {
        input: `${reactId}${baseIds.input}`,
        label: `${reactId}${baseIds.label}`,
        error: `${reactId}${baseIds.error}`,
        description: `${reactId}${baseIds.description}`,
        testId: baseIds.testId, // Test ID doesn't need React prefix
    };
}

/**
 * Hook for generating multiple unique IDs for a component.
 * Useful for components with multiple interactive elements.
 *
 * @param page - The page or feature name
 * @param component - The component name
 * @param elements - Array of element names and their types
 * @returns Object with IDs for each element
 *
 * @example
 * const ids = useMultipleIds('settings', 'profile', [
 *   ['name', 'input'],
 *   ['email', 'input'],
 *   ['submit', 'button']
 * ]);
 * // Returns: {
 * //   name: ':R1:settings-profile-name-input',
 * //   email: ':R1:settings-profile-email-input',
 * //   submit: ':R1:settings-profile-submit-button'
 * // }
 */
export function useMultipleIds(
    page: string,
    component: string,
    elements: Array<[string, string]>,
): Record<string, string> {
    const reactId = useId();

    return elements.reduce(
        (acc, [element, type]) => {
            acc[element] =
                `${reactId}${generateId(page, component, element, type)}`;
            return acc;
        },
        {} as Record<string, string>,
    );
}
