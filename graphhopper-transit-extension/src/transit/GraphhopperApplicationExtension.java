package transit;

import com.graphhopper.http.*;
import com.graphhopper.http.cli.ImportCommand;
import com.graphhopper.http.resources.RootResource;
import io.dropwizard.Application;
import io.dropwizard.bundles.assets.ConfiguredAssetsBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;

import javax.servlet.DispatcherType;
import java.util.EnumSet;

public class GraphhopperApplicationExtension extends Application<ExtensionServerConfiguration> {
    public static void main(String[] args) throws Exception {
        new GraphHopperApplication().run(args);
    }

    @Override
    public void initialize(Bootstrap<ExtensionServerConfiguration> bootstrap) {
        bootstrap.addBundle(new GraphHopperBundle());
        bootstrap.addBundle(new ConfiguredAssetsBundle("/assets/", "/maps/", "index.html"));
        bootstrap.addCommand(new ImportCommand(bootstrap.getObjectMapper()));
    }

    @Override
    public void run(ExtensionServerConfiguration configuration, Environment environment) {
        environment.jersey().register(new RootResource());
        environment.servlets().addFilter("cors", CORSFilter.class).addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), false, "*");
        environment.servlets().addFilter("ipfilter", new IPFilter(configuration.getGraphHopperConfiguration().get("jetty.whiteips", ""), configuration.getGraphHopperConfiguration().get("jetty.blackips", ""))).addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), false, "*");
    }
}
