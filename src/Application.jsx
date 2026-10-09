import React from "react";
import {BrowserRouter} from "react-router-dom";
import {App} from "./App";
import {AuthProvider} from "./hooks/useAuth";
import {I18nProvider} from "./lib/i18n";
export function Application({initialLanguage}={}){return <React.StrictMode><BrowserRouter><AuthProvider><I18nProvider initialLanguage={initialLanguage}><App /></I18nProvider></AuthProvider></BrowserRouter></React.StrictMode>;}
