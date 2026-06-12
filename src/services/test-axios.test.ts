import { vi, describe, it, expect } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  console.log("MOCK FACTORY CALLED!");
  return {
    default: {
      create: () => {
        console.log("MOCK CREATE CALLED!");
        return { mock: true };
      }
    }
  };
});

describe('Test Axios Mocking', () => {
  it('should mock axios.create', () => {
    console.log("axios is:", axios);
    const instance = axios.create();
    console.log("instance is:", instance);
    expect(instance).toEqual({ mock: true });
  });
});
