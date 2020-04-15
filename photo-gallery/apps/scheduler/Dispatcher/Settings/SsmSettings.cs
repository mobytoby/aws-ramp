namespace Dispatcher.Settings
{
  public class SsmSettings
  {
    public string apiKey { get; set; }
    public string appSyncApi { get; set; }
    public string cluster { get; set; }
    public string[] securityGroups { get; set; }
    public string[] subnets { get; set; }
    public string taskDefinition { get; set; }
  }
}