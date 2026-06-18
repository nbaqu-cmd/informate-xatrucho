@echo off
REM Infórmate Xatruch — ingest new Congress decrees and run the full pipeline.
REM Point Windows Task Scheduler at THIS file to automate ingestion.
REM It is safe to run repeatedly: decrees already in the database are skipped.
cd /d "%~dp0apps\api"
call npx tsx src/scripts/ingest-new-laws.ts >> "%~dp0ingest.log" 2>&1
