import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiClient } from '../../api/apiClient';

describe('EhostMeetingLinks', () => {
  test('renders platform suggestions and saves configuration', async () => {
    const { EhostMeetingLinks } = await import('./EhostMeetingLinks');

    apiClient.get.mockImplementation((url) => {
      if (url === '/ehost/experiences') {
        return Promise.resolve({ data: { data: [{ id: 1, location_name: 'X', status: 'approved' }] } });
      }
      if (url === '/ehost/experiences/1/meeting-link') {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    apiClient.put.mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <EhostMeetingLinks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/ehost/experiences');
    });
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/ehost/experiences/1/meeting-link');
    });

    const selects = screen.getAllByRole('combobox');
    const platformSelect = selects[1];

    expect(platformSelect).toHaveDisplayValue('Google Meet');
    expect(screen.getByRole('option', { name: 'Google Meet' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();

    const inputs = screen.getAllByRole('textbox');
    const meetingUrlInput = inputs[0];
    const meetingPasswordInput = inputs[1];

    fireEvent.change(platformSelect, { target: { value: 'Zoom' } });
    fireEvent.change(meetingUrlInput, { target: { value: 'https://zoom.us/j/123' } });
    fireEvent.change(meetingPasswordInput, { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/ehost/experiences/1/meeting-link', {
        platform: 'Zoom',
        meeting_url: 'https://zoom.us/j/123',
        meeting_password: 'pw',
      });
    });
  });
});

