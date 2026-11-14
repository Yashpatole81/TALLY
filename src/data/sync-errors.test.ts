import { isRowSpecificError } from './sync-errors';

describe('isRowSpecificError', () => {
  it('treats constraint and data errors as row-specific', () => {
    expect(isRowSpecificError({ code: '23514' })).toBe(true); // check_violation
    expect(isRowSpecificError({ code: '23503' })).toBe(true); // foreign_key_violation
    expect(isRowSpecificError({ code: '22P02' })).toBe(true); // invalid_text_representation
  });

  it('treats everything else as a whole-run failure', () => {
    expect(isRowSpecificError({ code: '42501' })).toBe(false); // insufficient_privilege (RLS)
    expect(isRowSpecificError({ code: 'PGRST301' })).toBe(false); // JWT expired
    expect(isRowSpecificError({ code: '' })).toBe(false);
    expect(isRowSpecificError({})).toBe(false);
    expect(isRowSpecificError(null)).toBe(false);
  });
});
