using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dispatcher.Settings;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Dispatcher
{
  public class Startup
  {
    public IConfiguration Configuration { get; }
    public Startup(IConfiguration configuration)
    {
      Configuration = configuration;
    }


    readonly string CorsPolicy = "corspolicy";

    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
      services.AddCors(options =>
          options.AddPolicy(CorsPolicy,
          builder =>
          {
            builder.WithOrigins("*");
            builder.WithMethods("*");
            builder.WithHeaders("*");
          })
      );
      services.Configure<ProcessingSettings>(Configuration.GetSection("Processing"));
      services.Configure<SsmSettings>(Configuration.GetSection("settings"));
      services.AddScoped<IAppSyncService, AppSyncService>();
      services.AddScoped<IProcessingService, ProcessingService>();
      services.AddScoped<IDispatcherService, DispatcherService>();
      services.AddScoped<IStorageService, StorageService>();
      services.AddControllers();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
      if (env.IsDevelopment())
      {
        app.UseDeveloperExceptionPage();
      }
      app.UseRouting();
      app.UseCors(CorsPolicy);
      app.UseAuthorization();

      app.UseEndpoints(endpoints =>
      {
        endpoints.MapControllers();
      });
    }
  }
}
