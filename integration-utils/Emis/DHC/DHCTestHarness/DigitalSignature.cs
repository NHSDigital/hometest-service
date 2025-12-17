using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography.Xml;
using System.Text;
using System.Xml;

namespace DHCTestHarness
{
    public class DigitalSignature
    {
        private readonly X509Certificate2 _certificate;
        public readonly byte[] MessageHash;
        public readonly byte[] Signature;
        public byte[] BinarySecurityToken => _certificate.RawData;
        public string CertificateCommonName => _certificate.GetNameInfo(X509NameType.SimpleName, false);
		
        public DigitalSignature(XmlDocument document, string certificatePath, string certificatePassphrase)
        {
            _certificate = new X509Certificate2(certificatePath, certificatePassphrase);
			
            if (_certificate == null)
            {
                throw new Exception($"Could not get certificate {certificatePath}");
            }

            XmlNodeList nodeList = document.GetElementsByTagName("EWDS");

            Console.WriteLine("outerXml");
            Console.WriteLine(nodeList[0].OuterXml); // NO LINE BREAKS!

            string canonicalisedXml = CanonicaliseXml(nodeList[0].OuterXml);
            Console.WriteLine("canonicalisedXml");
            Console.WriteLine(canonicalisedXml);

            Console.WriteLine("BinarySecurityToken");
            Console.WriteLine(Convert.ToBase64String(BinarySecurityToken));
            
            MessageHash = CreateDigest(canonicalisedXml);
            Console.WriteLine("MessageHash");
            Console.WriteLine(Convert.ToHexString(MessageHash));
            Console.WriteLine(Convert.ToBase64String(MessageHash));
            
            Signature = CreateSignature(MessageHash);
            Console.WriteLine("Signature");
            Console.WriteLine(Convert.ToBase64String(Signature));
        }

        private static string CanonicaliseXml(string inputXml)
        {
            XmlDocument xmlDocument = new XmlDocument();
            string xmlWithNormalisedLineEndings = inputXml.Replace(Environment.NewLine, "\n");
            xmlDocument.LoadXml(xmlWithNormalisedLineEndings);

            XmlDsigExcC14NTransform transform = new XmlDsigExcC14NTransform(false);
            transform.LoadInput(xmlDocument);

            using var streamReader = new StreamReader((Stream) transform.GetOutput(typeof(Stream)));
            return streamReader.ReadToEnd();
        }

        private static byte[] CreateDigest(string input)
        {
            String inputXml = "<EWDS xmlns=\"urn:nhs-itk:ns:201005\"><RequestHeader><ExternalUserName>DHSCTest</ExternalUserName><MachineName>EC2AMAZ-HK042CK</MachineName></RequestHeader><RequestBody><RequestMethod><MethodDefinition><Name>Emis.Interop.PatientAPI.GetMedicalRecord</Name><Version>1.0.0.0</Version></MethodDefinition><Content><PatientAPI><SmartCardTokenId></SmartCardTokenId><MacAddress>18-03-73-BB-6B-02</MacAddress><NhsNumber>9993855774</NhsNumber></PatientAPI></Content></RequestMethod></RequestBody></EWDS>";   
            using var hashAlgorithm = SHA1.Create();
            return hashAlgorithm.ComputeHash(Encoding.UTF8.GetBytes(inputXml));
        }

        private byte[] CreateSignature(byte[] hash)
        {
            Console.WriteLine("certificate");
            Console.WriteLine(_certificate.GetRSAPrivateKey());
            RSAPKCS1SignatureFormatter signatureFormatter = new RSAPKCS1SignatureFormatter(_certificate.GetRSAPrivateKey());
            signatureFormatter.SetHashAlgorithm("SHA1");
            byte[] signature = signatureFormatter.CreateSignature(hash);

            return signature;
        }
    }
}