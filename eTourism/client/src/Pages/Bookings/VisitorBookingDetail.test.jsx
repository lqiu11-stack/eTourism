import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '../../api/apiClient';

describe('VisitorBookingDetail meeting link messaging', () => {
  test('shows informational message when meeting link is forbidden (not confirmed)', async () => {
    const { VisitorBookingDetail } = await import('./VisitorBookingDetail');

    apiClient.get.mockImplementation((url) => {
      if (url === '/visitor/bookings/55') {
        return Promise.resolve({ data: { id: 55, status: 'pending', amount_paid: 10, experience_id: 1 } });
      }
      if (url === '/visitor/bookings/55/meeting-link') {
        return Promise.reject({ response: { status: 403, data: { message: 'Meeting link is only available for successfully booked experiences' } } });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(
      <MemoryRouter initialEntries={['/visitor/bookings/55']}>
        <Routes>
          <Route path="/visitor/bookings/:id" element={<VisitorBookingDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Meeting link is only available for successfully booked experiences')).toBeInTheDocument();
  });

  test('shows informational message when meeting link not configured yet', async () => {
    const { VisitorBookingDetail } = await import('./VisitorBookingDetail');

    apiClient.get.mockImplementation((url) => {
      if (url === '/visitor/bookings/55') {
        return Promise.resolve({ data: { id: 55, status: 'confirmed', amount_paid: 10, experience_id: 1 } });
      }
      if (url === '/visitor/bookings/55/meeting-link') {
        return Promise.reject({ response: { status: 404, data: { message: 'Meeting link is not configured yet' } } });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(
      <MemoryRouter initialEntries={['/visitor/bookings/55']}>
        <Routes>
          <Route path="/visitor/bookings/:id" element={<VisitorBookingDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Meeting link is not configured yet')).toBeInTheDocument();
  });
});

