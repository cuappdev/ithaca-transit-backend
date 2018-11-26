package transit;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.graphhopper.http.GraphHopperServerConfiguration;
import com.graphhopper.util.CmdArgs;
import io.dropwizard.bundles.assets.AssetsConfiguration;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

public class ExtensionServerConfiguration extends GraphHopperServerConfiguration {
    @NotNull
    @JsonProperty
    private final CmdArgs graphhopper = new CmdArgs();

    @Valid
    @JsonProperty
    private final AssetsConfiguration assets = AssetsConfiguration.builder().build();

    public ExtensionServerConfiguration() {
    }

    @Override
    public CmdArgs getGraphHopperConfiguration() {
        return graphhopper;
    }

    @Override
    public AssetsConfiguration getAssetsConfiguration() {
        return assets;
    }
}
