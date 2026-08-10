import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import store from "./store/store";
import { setupAxios, registerStore } from "./config/axiosSetup";

// Registers the axios interceptors that attach the auth token and the active
// campus header. Must run before anything renders — every API route requires
// auth now, so a request fired without this gets a 401.
setupAxios();

// Lets setActiveCampusId empty the store when a super admin switches campus,
// without axiosSetup importing the store directly and closing a require cycle.
registerStore(store);

// React Query used to wrap this tree. It was removed because nothing consumed
// it: the two hook files that called useQuery were never imported by any page,
// and every page fetches through Redux thunks or axios directly. Keeping the
// provider only shipped the library to users for no benefit.

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-center" />
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
