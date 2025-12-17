using System.Net;
using System.Text;

namespace DHCTestHarness
{
    public class EmisTransactionApiClient
    {
        private readonly string _serviceUri;
        private readonly DigitalSignature _digitalSignature;

        public EmisTransactionApiClient(string serviceUri, DigitalSignature digitalSignature)
        {
            _serviceUri = serviceUri;
            _digitalSignature = digitalSignature;
        }
		
        public string SendRequest(string xmlPayload)
        {
            var httpWebRequest = WebRequest.Create(new Uri(_serviceUri));

            httpWebRequest.Method = "POST";
            httpWebRequest.ContentType = "application/xml";
            httpWebRequest.Headers.Add("CertificateCommonName", _digitalSignature.CertificateCommonName);
			
            var data = new StringBuilder();
            data.Append(xmlPayload);
            byte[] byteData = Encoding.UTF8.GetBytes(data.ToString());
            httpWebRequest.ContentLength = byteData.Length;

            using (Stream postStream = httpWebRequest.GetRequestStream())
            {
                postStream.Write(byteData, 0, byteData.Length);
            }

            HttpWebResponse httpResponse;
            string rawResponse;
			
            try
            {
                httpResponse = (HttpWebResponse)httpWebRequest.GetResponse();
            }
            catch (WebException wex)
            {

                if (wex.Response == null)
                    throw;

                httpResponse = (HttpWebResponse)wex.Response;
            }
            using (var responseReader = new StreamReader(httpResponse.GetResponseStream()))
            {
                rawResponse = responseReader.ReadToEnd();
            }

            return rawResponse;
        }
    }
}