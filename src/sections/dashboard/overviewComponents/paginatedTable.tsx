import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";

export default function PaginatedTable({
  columns,
  rows,
  pageState,
  onChangePage,
  onChangeRows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  pageState: { page: number; rowsPerPage: number };
  onChangePage: (p: number) => void;
  onChangeRows: (r: number) => void;
}) {
  const { page, rowsPerPage } = pageState;
  const paged = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper variant="outlined" sx={{ bgcolor: "background.paper" }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c} sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                  {c}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((r, i) => (
              <TableRow key={i}>
                {r.map((cell, j) => (
                  <TableCell key={j} sx={{ whiteSpace: "nowrap" }}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary">
                    No data
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={(_, p) => onChangePage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onChangeRows(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
}
