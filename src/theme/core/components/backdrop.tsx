import type { Theme, Components } from '@mui/material/styles';

import { varAlpha } from '../../styles';

// ----------------------------------------------------------------------

const MuiBackdrop: Components<Theme>['MuiBackdrop'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: varAlpha(theme.vars.palette.grey['800Channel'], 0.48),
      backdropFilter: "blur(6px)", //
    }),
    invisible: { background: 'transparent' },
  },
};

// ----------------------------------------------------------------------

export const backdrop = { MuiBackdrop };
