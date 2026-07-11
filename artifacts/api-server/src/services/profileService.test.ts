import { describe, test, expect } from 'vitest';
import { validateModuleSettings } from './profileValidation';

describe('ProfileService - Module Settings Validation', () => {
  test('valid module settings pass validation', () => {
    const validSettings = [
      { id: 'about' as const, visible: true, visibility: 'everyone' as const, order: 0 },
      { id: 'topFriends' as const, visible: true, visibility: 'friends' as const, order: 1 },
      { id: 'mood' as const, visible: true, visibility: 'onlyMe' as const, order: 2 },
      { id: 'posts' as const, visible: true, visibility: 'everyone' as const, order: 3 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Validation function accepts any for testing
    const errors = validateModuleSettings(validSettings as any);
    expect(errors).toHaveLength(0);
  });

  test('invalid module ID is rejected', () => {
    const invalidSettings = [
      { id: 'invalidModule' as const, visible: true, visibility: 'everyone' as const, order: 0 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Validation function accepts any for testing
    const errors = validateModuleSettings(invalidSettings as any);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('moduleSettings[0].id');
    expect(errors[0].message).toContain('Invalid module ID');
  });

  test('duplicate module IDs are rejected', () => {
    const duplicateSettings = [
      { id: 'about' as const, visible: true, visibility: 'everyone' as const, order: 0 },
      { id: 'about' as const, visible: true, visibility: 'friends' as const, order: 1 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Validation function accepts any for testing
    const errors = validateModuleSettings(duplicateSettings as any);
    expect(errors.length).toBeGreaterThan(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Test data requires any types
    const duplicateError = errors.find((e: any) => e.message.includes('Duplicate'));
    expect(duplicateError).toBeDefined();
  });

  test('invalid visibility is rejected', () => {
    const invalidSettings = [
      { id: 'about' as const, visible: true, visibility: 'invalid' as const, order: 0 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Validation function accepts any for testing
    const errors = validateModuleSettings(invalidSettings as any);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('moduleSettings[0].visibility');
    expect(errors[0].message).toContain('Invalid visibility');
  });

  test('negative order is rejected', () => {
    const invalidSettings = [
      { id: 'about' as const, visible: true, visibility: 'everyone' as const, order: -1 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Validation function accepts any for testing
    const errors = validateModuleSettings(invalidSettings as any);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('moduleSettings[0].order');
    expect(errors[0].message).toContain('non-negative');
  });

  test('non-boolean visible is rejected', () => {
    const invalidSettings = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing invalid type
      { id: 'about' as const, visible: 'true' as any, visibility: 'everyone' as const, order: 0 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Validation function accepts any for testing
    const errors = validateModuleSettings(invalidSettings as any);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('moduleSettings[0].visible');
    expect(errors[0].message).toContain('boolean');
  });

  test('multiple errors are reported', () => {
    const invalidSettings = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing invalid types
      { id: 'invalid' as const, visible: 'true' as any, visibility: 'invalid' as const, order: -1 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Validation function accepts any for testing
    const errors = validateModuleSettings(invalidSettings as any);
    expect(errors.length).toBeGreaterThan(1);
  });

  test('empty module settings are valid', () => {
    const errors = validateModuleSettings([]);
    expect(errors).toHaveLength(0);
  });
});
