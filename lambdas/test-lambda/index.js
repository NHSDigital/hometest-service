exports.handler = async (event) => {
    console.log("Test Lambda Invoked");
    return {
        statusCode: 200,
        body: JSON.stringify('Hello from Test Lambda!'),
    };
}
