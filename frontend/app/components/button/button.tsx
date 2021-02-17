import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import b, { Mods, Mix } from 'bem-react-helper';
import classnames from 'classnames';

export type ButtonProps = Omit<JSX.HTMLAttributes, 'size' | 'className'> & {
  kind?: 'primary' | 'secondary' | 'link';
  size?: 'middle' | 'large';
  mods?: Mods;
  mix?: Mix;
  type?: string;
  permanentClassName?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, mods, mix, kind, type = 'button', size, permanentClassName, ...props }, ref) => (
    <button
      className={classnames(permanentClassName, b('button', { mods: { kind, size }, mix }, { ...mods }))}
      type={type}
      {...props}
      ref={ref}
    >
      {children}
    </button>
  )
);
