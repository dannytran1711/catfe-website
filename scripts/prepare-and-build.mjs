import './build-catfe.mjs';
import { spawnSync } from 'node:child_process';
const result=spawnSync(process.execPath,['scripts/run-framework.mjs','build'],{stdio:'inherit'});
process.exit(result.status??1);
