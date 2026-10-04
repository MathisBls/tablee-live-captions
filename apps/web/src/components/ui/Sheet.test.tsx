import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Sheet } from './Sheet';

function renderSheet(open: boolean, onClose = vi.fn()) {
  return render(
    <>
      <button type="button">Ouvrir</button>
      <Sheet open={open} onClose={onClose} title="Ce que tu as raté" closeLabel="Fermer">
        <p>Paul raconte ses vacances.</p>
        <button type="button">Réessayer</button>
      </Sheet>
    </>,
  );
}

describe('Sheet', () => {
  it('renders nothing while closed', () => {
    renderSheet(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a modal dialog named by its title and takes the focus', () => {
    renderSheet(true);
    const dialog = screen.getByRole('dialog', { name: 'Ce que tu as raté' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
  });

  it('closes with Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderSheet(true, onClose);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes with its labelled close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderSheet(true, onClose);

    await user.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps keyboard focus inside the sheet', async () => {
    const user = userEvent.setup();
    renderSheet(true);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();
  });

  it('gives the focus back to what had it once closed', () => {
    const { rerender } = renderSheet(false);
    const opener = screen.getByRole('button', { name: 'Ouvrir' });
    opener.focus();

    rerender(
      <>
        <button type="button">Ouvrir</button>
        <Sheet open onClose={vi.fn()} title="Ce que tu as raté" closeLabel="Fermer">
          <p>Paul raconte ses vacances.</p>
        </Sheet>
      </>,
    );
    expect(opener).not.toHaveFocus();

    rerender(
      <>
        <button type="button">Ouvrir</button>
        <Sheet open={false} onClose={vi.fn()} title="Ce que tu as raté" closeLabel="Fermer">
          <p>Paul raconte ses vacances.</p>
        </Sheet>
      </>,
    );
    expect(opener).toHaveFocus();
  });
});
