import { createTheme } from "@mui/material";
import { red } from "@mui/material/colors";

export default createTheme({
    palette: {
        primary: {
            main: "#2D2D48"
        },
        secondary: {
            main: "#19857B"
        },
        error: {
            main: red.A400
        }
    }
});
