using System;
using System.Threading.Tasks;
using Dispatcher.Settings;
using GraphQL;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.Newtonsoft;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace Dispatcher
{
 public interface IAppSyncService {
    Task<bool> MarkAsDone(ImageJob job);
    
  }
  public class AppSyncService: IAppSyncService {
    private IOptions<SsmSettings> Options { get; }
    private IConfiguration Config {get;}

    public AppSyncService(IOptions<SsmSettings> options) {
      Options = options;
    }

    public async Task<bool> MarkAsDone(ImageJob job) {
      if (job == null) {
        Console.Error.WriteLine("Unable to mark as done. Job is null.");
        return false;
      }
      var options = Options.Value;
      var url = options.appSyncApi;
      if (url == null) {
        Console.Error.WriteLine("Unable to find configuration for AppSync GraphQL API Endpoint");
        return false;
      }
      var apiKey = options.apiKey;
      if (apiKey == null) {
        Console.Error.WriteLine("Unable to find configuration for ApiKey");
        return false;
      }

      using var client = new GraphQLHttpClient(url, new NewtonsoftJsonSerializer());
      client.HttpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
      var request = new GraphQLRequest
            {
                Query = @"
                    mutation UpdateIsDone($input: UpdateImageJobInput!) {
                        updateImageJob(input: $input) {
                            id,
                            isDone
                        }
                    }                
                ",
                OperationName = "UpdateIsDone",
                Variables = new {
                    input = new {
                        id = job.Id.ToString(),
                        isDone = true
                    }
                }
            };
      var graphQLResponse = await client.SendMutationAsync<UpdateImageJobResponse>(request);
      return true;
    }

    public class UpdateImageJobResponse {
      public string id {get;set;}
    }
  }


}