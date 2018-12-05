package transit;

import com.graphhopper.http.*;
import com.graphhopper.http.cli.ImportCommand;
import com.graphhopper.http.resources.RootResource;
import com.graphhopper.matching.cli.GetBoundsCommand;
import com.graphhopper.matching.cli.MatchCommand;
import com.graphhopper.matching.cli.MeasurementCommand;
import com.graphhopper.matching.http.MapMatchingApplication;
import com.graphhopper.matching.http.MapMatchingResource;
import io.dropwizard.Application;
import io.dropwizard.bundles.assets.ConfiguredAssetsBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import transit.http.ExtensionServerConfiguration;

import javax.servlet.DispatcherType;
import java.util.EnumSet;

public class GraphhopperApplicationExtension extends Application<ExtensionServerConfiguration> {

    public static void main(String[] args) throws Exception {
        new GraphHopperApplication().run(args);
        new MapMatchingApplication().run(args);
    }

    @Override
    public void initialize(Bootstrap<ExtensionServerConfiguration> bootstrap) {
        bootstrap.addBundle(new GraphHopperBundle());
        bootstrap.addBundle(
                new ConfiguredAssetsBundle(
                        "/assets/",
                        "/maps/",
                        "index.html"
                )
        );
        bootstrap.addCommand(new ImportCommand(bootstrap.getObjectMapper()));

        //map-matching
        //bootstrap.addBundle(new GraphHopperBundle());
        bootstrap.addCommand(new com.graphhopper.matching.cli.ImportCommand());
        bootstrap.addCommand(new MatchCommand());
        bootstrap.addCommand(new GetBoundsCommand());
        bootstrap.addCommand(new MeasurementCommand());
        bootstrap.addBundle(
                new ConfiguredAssetsBundle(
                        "/assets/mapmatching-webapp/",
                        "/app/",
                        "index.html"
                )
        );
    }

    @Override
    public void run(ExtensionServerConfiguration configuration, Environment environment) {
        // Register root resource and add IP/CORS filters
        environment.jersey().register(new RootResource());
        environment.servlets().addFilter(
                "cors",
                CORSFilter.class
        ).addMappingForUrlPatterns(
                EnumSet.allOf(DispatcherType.class),
                false,
                "*"
        );

        environment.servlets().addFilter(
                "ipfilter",
                new IPFilter(configuration.getGraphHopperConfiguration().get(
                        "jetty.whiteips",
                        ""),
                        configuration.getGraphHopperConfiguration().get(
                                "jetty.blackips",
                                "")))
                .addMappingForUrlPatterns(
                        EnumSet.allOf(DispatcherType.class),
                        false,
                        "*"
                );

        // Register map-matching resources
        environment.jersey().register(MapMatchingResource.class);
        environment.jersey().register(new com.graphhopper.matching.http.RootResource());
    }
}
