
using System;
using System.Threading.Tasks;
using GraphQL;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.Newtonsoft;
using Microsoft.Extensions.Options;

namespace job_scheduler {

  public interface IAppSyncService {
    ImageJob Job { set;}
    Task<bool> MarkAsDone();
    
  }
  public class AppSyncService: IAppSyncService {
    public  ImageJob Job { private get; set; }
    private IOptions<AppSyncSettings> Options { get; }

    public AppSyncService(IOptions<AppSyncSettings> options) {
      Options = options;
    }

    public async Task<bool> MarkAsDone() {
      if (Job == null) {
        return false;
      }
      var options = Options.Value;
      var url = options.ApiEndpoint;
      if (url == null) {
        Console.Error.WriteLine("Unable to find configuration for AppSync GraphQL API Endpoint");
        return false;
      }
      var apiKey = options.ApiKey;
      if (apiKey == null) {
        Console.Error.WriteLine("Unable to find configuration for ApiKey");
        return false;
      }

      using var client = new GraphQLHttpClient(url,new NewtonsoftJsonSerializer());
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
                        id = Job.Id.ToString(),
                        isDone = true
                    }
                }
            };

      var graphQLResponse = await client.SendMutationAsync<UpdateImageJobResponse>(request);
      return true;
    }
  }

  public class UpdateImageJobResponse {
    public string id {get;set;}
  }

}