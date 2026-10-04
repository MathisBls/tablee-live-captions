import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('is a plain button by default so it never submits a form by accident', () => {
    render(<Button>Passer à table</Button>);
    expect(screen.getByRole('button', { name: 'Passer à table' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('calls onClick when activated with the keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Qu’est-ce que j’ai raté ?</Button>);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and announced as busy while an action is running', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button busy onClick={onClick}>
        On met la table…
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'On met la table…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards native attributes such as type submit', () => {
    render(<Button type="submit">Valider</Button>);
    expect(screen.getByRole('button', { name: 'Valider' })).toHaveAttribute('type', 'submit');
  });
});
