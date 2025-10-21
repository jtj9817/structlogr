import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * UNIQUE IDENTIFIER SYSTEM FOR STRUCTLOGR
 * ========================================
 *
 * This file implements a comprehensive unique identifier system for all DOM elements
 * and React components throughout the StructLogr application.
 *
 * ID NAMING CONVENTION:
 * =====================
 *
 * Format: {page/feature}-{component}-{element}-{type}
 *
 * Examples:
 * - auth-login-email-input (Authentication page, login component, email element, input type)
 * - settings-profile-name-input (Settings page, profile component, name element, input type)
 * - formatter-raw-log-textarea (Formatter page, raw log component, textarea element)
 * - auth-login-email-label (Authentication page, login component, email element, label type)
 *
 * TEST ID NAMING CONVENTION:
 * ==========================
 *
 * Format: test-{page/feature}-{component}-{element}
 *
 * Examples:
 * - test-auth-login-email (Test ID for login email field)
 * - test-settings-profile-name (Test ID for profile name field)
 * - test-formatter-raw-log (Test ID for formatter raw log textarea)
 *
 * USAGE GUIDELINES:
 * ==================
 *
 * 1. Use semantic, human-readable names that describe the element's purpose
 * 2. Follow the consistent pattern: page-feature-component-element-type
 * 3. Use lowercase letters and hyphens only (no spaces or underscores)
 * 4. Keep names concise but descriptive
 * 5. Ensure IDs are unique across the entire application
 *
 * ACCESSIBILITY:
 * ==============
 *
 * - All form inputs have corresponding labels with matching htmlFor/id
 * - Error messages are linked to inputs via aria-describedby
 * - Test IDs use data-testid attributes for testing frameworks
 * - ARIA attributes reference correct IDs for screen readers
 *
 * SSR COMPATIBILITY:
 * ==================
 *
 * - Use the useUniqueId hook for React components requiring SSR compatibility
 * - Utility functions generate deterministic IDs for consistency
 * - Test IDs remain consistent between server and client renders
 */

/**
 * Generates a unique, deterministic ID for DOM elements and components.
 * Format: {page/feature}-{component}-{element}-{type}
 *
 * @param page - The page or feature name (e.g., 'auth', 'settings', 'formatter')
 * @param component - The component name (e.g., 'login', 'profile', 'input')
 * @param element - The specific element (e.g., 'email', 'password', 'submit')
 * @param type - The element type (e.g., 'input', 'label', 'button', 'description')
 * @returns A unique, human-readable ID string
 *
 * @example
 * generateId('auth', 'login', 'email', 'input') // 'auth-login-email-input'
 * generateId('settings', 'profile', 'name', 'label') // 'settings-profile-name-label'
 */
export function generateId(
    page: string,
    component: string,
    element: string,
    type: string,
): string {
    const parts = [page, component, element, type]
        .map((part) => part.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
        .filter((part) => part.length > 0);

    return parts.join('-');
}

/**
 * Generates a deterministic test ID for testing purposes.
 * Format: test-{page/feature}-{component}-{element}
 *
 * @param page - The page or feature name
 * @param component - The component name
 * @param element - The specific element
 * @returns A test ID string for data-testid attributes
 *
 * @example
 * generateTestId('auth', 'login', 'email') // 'test-auth-login-email'
 */
export function generateTestId(
    page: string,
    component: string,
    element: string,
): string {
    const parts = ['test', page, component, element]
        .map((part) => part.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
        .filter((part) => part.length > 0);

    return parts.join('-');
}

/**
 * Creates a set of related IDs for form elements (input, label, error, description).
 * Ensures all related elements use consistent IDs for accessibility.
 *
 * @param page - The page or feature name
 * @param component - The component name
 * @param element - The form element name
 * @returns Object containing related IDs
 *
 * @example
 * const ids = createFormIds('auth', 'login', 'email');
 * // Returns: {
 * //   input: 'auth-login-email-input',
 * //   label: 'auth-login-email-label',
 * //   error: 'auth-login-email-error',
 * //   description: 'auth-login-email-description',
 * //   testId: 'test-auth-login-email'
 * // }
 */
export function createFormIds(
    page: string,
    component: string,
    element: string,
) {
    return {
        input: generateId(page, component, element, 'input'),
        label: generateId(page, component, element, 'label'),
        error: generateId(page, component, element, 'error'),
        description: generateId(page, component, element, 'description'),
        testId: generateTestId(page, component, element),
    };
}
