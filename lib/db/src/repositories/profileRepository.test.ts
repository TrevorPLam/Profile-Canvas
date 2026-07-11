import { describe, it, expect } from 'vitest';
import { type ProfileModule } from '../schema';
import { visibleModulesFor } from '../domain/profileVisibility';

describe('visibleModulesFor', () => {
  const moduleSettings: ProfileModule[] = [
    { id: 'about', visible: true, visibility: 'everyone', order: 0 },
    { id: 'topFriends', visible: true, visibility: 'friends', order: 1 },
    { id: 'mood', visible: true, visibility: 'onlyMe', order: 2 },
    { id: 'posts', visible: true, visibility: 'everyone', order: 3 },
    { id: 'topFriends', visible: false, visibility: 'everyone', order: 4 },
  ];

  it('should show all modules to self', () => {
    const visible = visibleModulesFor(moduleSettings, true, false);

    expect(visible).toHaveLength(4); // All except hidden
    expect(visible.map((m) => m.id)).toContain('mood'); // onlyMe visible to self
  });

  it('should show only everyone modules to strangers', () => {
    const visible = visibleModulesFor(moduleSettings, false, false);

    expect(visible).toHaveLength(2); // about and posts
    expect(visible.map((m) => m.id)).toEqual(['about', 'posts']);
    expect(visible.map((m) => m.id)).not.toContain('topFriends'); // friends only
    expect(visible.map((m) => m.id)).not.toContain('mood'); // onlyMe
  });

  it('should show everyone and friends modules to friends', () => {
    const visible = visibleModulesFor(moduleSettings, false, true);

    expect(visible).toHaveLength(3); // about, topFriends, posts
    expect(visible.map((m) => m.id)).toContain('topFriends');
    expect(visible.map((m) => m.id)).not.toContain('mood'); // onlyMe
  });

  it('should hide invisible modules regardless of viewer', () => {
    const visible = visibleModulesFor(moduleSettings, true, false);

    expect(visible.map((m) => m.id)).not.toContain('hidden');
  });

  it('should sort modules by order', () => {
    const unsorted: ProfileModule[] = [
      { id: 'posts', visible: true, visibility: 'everyone', order: 3 },
      { id: 'about', visible: true, visibility: 'everyone', order: 0 },
      { id: 'mood', visible: true, visibility: 'everyone', order: 2 },
    ];

    const visible = visibleModulesFor(unsorted, true, false);

    expect(visible.map((m) => m.id)).toEqual(['about', 'mood', 'posts']);
  });

  it('should handle empty module settings', () => {
    const visible = visibleModulesFor([], true, false);
    expect(visible).toHaveLength(0);
  });
});
