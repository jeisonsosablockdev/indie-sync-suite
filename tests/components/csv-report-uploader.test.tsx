/**
 * @file csv-report-uploader.test.tsx
 * @layer Presentation Test
 * @description UI component tests for CsvReportUploader (HU-5.4 / SPEC-05-02).
 *              Verifies dropzone rendering, file upload simulation, parsing preview, and commit actions.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CsvReportUploader } from '../../apps/web/src/components/analytics/csv-report-uploader';

describe('Presentation: CsvReportUploader (SPEC-05-02)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  test('renders initial drag and drop zone', () => {
    render(<CsvReportUploader releaseId={releaseId} />);

    expect(screen.getByText('Sube tu reporte analítico CSV')).toBeDefined();
    expect(
      screen.getByText(/Arrastra un archivo exportado de Spotify for Artists/i)
    ).toBeDefined();
  });

  test('processes valid CSV file and renders preview summary and commit button', async () => {
    const handleSuccess = vi.fn();
    render(<CsvReportUploader releaseId={releaseId} onSuccess={handleSuccess} />);

    const sampleCsv = `date,streams,listeners,saves,country
2026-11-14,1500,900,120,MX
2026-11-15,3200,2100,340,CO`;

    const file = new File([sampleCsv], 'spotify_release_nov.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('spotify_release_nov')).toBeDefined();
      expect(screen.getByText('SPOTIFY')).toBeDefined();
      expect(screen.getByText('2')).toBeDefined(); // 2 valid rows
      expect(screen.getByRole('button', { name: /Importar 2 Registros/i })).toBeDefined();
    });

    // Click Import
    const importBtn = screen.getByRole('button', { name: /Importar 2 Registros/i });
    fireEvent.click(importBtn);

    await waitFor(
      () => {
        expect(screen.getByText('¡Reporte importado con éxito!')).toBeDefined();
        expect(handleSuccess).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );
  });
});
