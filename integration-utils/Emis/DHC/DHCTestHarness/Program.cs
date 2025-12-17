using System.Text;
using System.Xml;
using Microsoft.Extensions.Configuration;

namespace DHCTestHarness
{
    internal class Program
    {
        public static void Main(string[] args)
        {
            IConfigurationRoot config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();

            var baseUrl = config["BaseUrl"]!;
            var file = config["File"]!;
            var externalUsername = config["ExternalUserName"]!;
            var machineName = config["MachineName"]!;
            var certificatePath = config["CertificatePath"]!;
            var certificatePassphrase = config["CertificatePassphrase"]!;
	        
            try
            {
                var url = new Uri($"{baseUrl}/ITK");

                using var sw = new StreamReader(file);
                var inputXml = sw.ReadToEnd();
				
                inputXml = inputXml.Replace("placeholder:ExternalUserName", externalUsername);
                inputXml = inputXml.Replace("placeholder:MachineName", machineName);

                var xmlDocument = new XmlDocument();
                xmlDocument.LoadXml(inputXml);

                var digitalSignature = new DigitalSignature(xmlDocument, certificatePath, certificatePassphrase);

                var handlingSpecification = xmlDocument.GetElementsByTagName("spec", "urn:nhs-itk:ns:201005");

                foreach (XmlNode node in handlingSpecification)
                {
                    var key = node.Attributes["key"];
                    var value = node.Attributes["value"]!;
					
                    if (key.InnerText == "emis:BinarySecurityToken")
                    {
                        value.InnerText = Convert.ToBase64String(digitalSignature.BinarySecurityToken);
                    }
                    else if (key.InnerText == "emis:MessageDigest")
                    {
                        value.InnerText = Convert.ToBase64String(digitalSignature.MessageHash);
                    }
                    else if (key.InnerText == "emis:Signature")
                    {
                        value.InnerText = Convert.ToBase64String(digitalSignature.Signature);
                    }
                }

                var emisClient = new EmisTransactionApiClient(url.ToString(), digitalSignature);
				
                var responseBody = emisClient.SendRequest(xmlDocument.OuterXml);
                var returnedXmlDoc = new XmlDocument();
                returnedXmlDoc.LoadXml(responseBody);
                Console.WriteLine(PrintXml(returnedXmlDoc.OuterXml));
            }
            catch (Exception exception)
            {
                Console.WriteLine(exception.Message);
            }

            Console.ReadKey();
        }

        private static String PrintXml(String xml)
        {
            String result = "";

            var mStream = new MemoryStream();
            var writer = new XmlTextWriter(mStream, Encoding.Unicode);
            var document = new XmlDocument();

            try
            {
                document.LoadXml(xml);
                writer.Formatting = Formatting.Indented;
                document.WriteContentTo(writer);
                writer.Flush();
                mStream.Flush();
                mStream.Position = 0;

                var sReader = new StreamReader(mStream);
                var formattedXml = sReader.ReadToEnd();
                result = formattedXml;
            }
            catch (XmlException)
            {
            }
            ;
            mStream.Close();
            writer.Close();

            return result;
        }
    }
}