namespace Dispatcher {
  
  public interface IDispatcherService
  {
    void Dispatch(ImageJob job);    
  }

  public class DispatcherService : IDispatcherService
  {
    public void Dispatch(ImageJob job)
    { 
    }
  }
}