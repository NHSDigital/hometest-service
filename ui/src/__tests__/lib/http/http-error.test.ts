import { HttpError } from '../../../lib/http/http-error';

describe('http-error', () => {
  it('should set message and response', () => {
    const response = { status: 404, data: 'Not found' };
    const error = new HttpError('Not found', response);
    expect(error.message).toBe('Not found');
    expect(error.response).toBe(response);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
  });
});
