# JMeter performance tests

## Prerequisites

- Disable NHS number restriction on the environment _infra/main/env/<ENV_NAME>.env_

```bash
ENABLE_NHS_NUMBER_CHECK=false
```

- Install Java e.g. OpenJDK 17 (Recommended way is to use java version manager e.g. jabba)

```bash
# Installing java
curl -fsSL https://github.com/shyiko/jabba/raw/master/install.sh | bash
source ~/.jabba/jabba.sh
Restart terminal
jabba install openjdk@1.17.0
jabba use openjdk@1.17.0
jabba alias default openjdk@1.17.0
# Validate java version
java -version
```

- Download the JMeter application from <https://jmeter.apache.org/> (latest zip package, working on 5.6.3 version)
- Unpack the archive and run `./jmeter` in the root directory to start the app
- Open the project file `tests.jmx`
- Add JMeter binary file directory to the PATH variable

```bash
# Adding to PATH
nano ~/.zshrc
export PATH=$PATH:/Users/yourname/apache-jmeter-5.6.3/bin
source ~/.zshrc
# Validate JMeter is available on the PATH
jmeter -v
```

## Running the tests

Make sure to be have working directory set to _/perf-tests_

Generate _test.properties_ file

```bash
./gen-test-setup.sh <env> <simulation>
```

[Available test simulations](https://nhsd-confluence.digital.nhs.uk/display/DHC/Performance+Testing):

- single-user
- load-test
- stress-test
- soak-test

To run the tests invoke the following command providing the env name as paramter

```bash
./run.sh <env>
```

## Debugging the tests

Open JMeter in GUI mode

```bash
 jmeter -t tests.jmx -q test.properties
```

Cleaning DynamoDB data (Purge healthchecks, orders and patients tables)

```bash
./clean-dynamodb-data.sh <env>
```

## Test scenarios

- User test data is generated just-in-time on loginning in - _mock_code_perf_test_user_ code
- Patient data and questionnare evaluation generate leicester score less than 16. Page "Tell us about your health symptoms" is not show to the user.
- Blood test results returns only cholesterol results.
- Simulation settings (users load, ramp setting etc.) need to be modifed manually in _jmx_ file
