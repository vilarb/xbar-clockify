#!/usr/bin/env /usr/local/bin/node
import "../utils/env-loader.js";
import { clockOut } from "../api/clockify-api.js";

await clockOut();
