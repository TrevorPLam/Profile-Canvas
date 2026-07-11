import { type ProfileModule } from '@workspace/db';

export interface ModuleValidationError {
  field: string;
  message: string;
}

/**
 * Validate module settings structure
 * This is pure validation logic with no database dependencies
 * @param moduleSettings - The module settings to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateModuleSettings(moduleSettings: ProfileModule[]): ModuleValidationError[] {
  const errors: ModuleValidationError[] = [];
  const validModuleIds = ['about', 'topFriends', 'mood', 'posts'];
  const validVisibilities = ['everyone', 'friends', 'onlyMe'];

  // Check for duplicate module IDs
  const seenIds = new Set<string>();
  for (let i = 0; i < moduleSettings.length; i++) {
    const module = moduleSettings[i];

    // Validate module ID
    if (!validModuleIds.includes(module.id)) {
      errors.push({
        field: `moduleSettings[${i}].id`,
        message: `Invalid module ID: ${module.id}. Must be one of: ${validModuleIds.join(', ')}`,
      });
    }

    // Check for duplicates
    if (seenIds.has(module.id)) {
      errors.push({
        field: `moduleSettings[${i}].id`,
        message: `Duplicate module ID: ${module.id}`,
      });
    }
    seenIds.add(module.id);

    // Validate visibility
    if (!validVisibilities.includes(module.visibility)) {
      errors.push({
        field: `moduleSettings[${i}].visibility`,
        message: `Invalid visibility: ${module.visibility}. Must be one of: ${validVisibilities.join(', ')}`,
      });
    }

    // Validate order is a non-negative number
    if (typeof module.order !== 'number' || module.order < 0) {
      errors.push({
        field: `moduleSettings[${i}].order`,
        message: `Order must be a non-negative number`,
      });
    }

    // Validate visible is a boolean
    if (typeof module.visible !== 'boolean') {
      errors.push({
        field: `moduleSettings[${i}].visible`,
        message: `Visible must be a boolean`,
      });
    }
  }

  return errors;
}
