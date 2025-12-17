import { __dirname } from '../../src/lib/path';
import path from 'path';

describe('When path utilities are imported', () => {
  it('should have __dirname pointing to the correct directory', () => {
    const expectedPath = path.resolve(__dirname, '../../src/lib');

    expect(__dirname).toBe(expectedPath);
  });

  it('should have __dirname as a string', () => {
    expect(typeof __dirname).toBe('string');
  });

  it('should have__dirname be an absolute path', () => {
    expect(path.isAbsolute(__dirname)).toBe(true);
  });
});
