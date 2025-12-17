#!/bin/bash

TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
RESULTS_FILE_NAME="results_${TIMESTAMP}.jtl"
HTML_REPORT_FILE_PATH="results_${TIMESTAMP}/"

echo "Starting performance tests"
jmeter -n -t tests.jmx -l $RESULTS_FILE_NAME -q test.properties -e -o $HTML_REPORT_FILE_PATH 
echo "HTML report generated to $HTML_REPORT_FILE_PATH"
